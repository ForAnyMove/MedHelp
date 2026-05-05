import React, { useRef, useEffect } from 'react';
import {
  StyleSheet, Text, TouchableOpacity, Animated,
  View, PanResponder, Platform, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../ui/Icon';
import { useChatNotifications } from '../../context/ChatNotificationContext';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const TOAST_WIDTH_LANDSCAPE = 340;
const SWIPE_THRESHOLD = 80;

function ToastCard({ notification, index, total, isLandscape, colors, sizes, onDismiss, onPress }) {
  const slideAnim = useRef(new Animated.Value(isLandscape ? 120 : -120)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 45,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: isLandscape ? 120 : -120,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(notification.id));
  };

  // Swipe gesture (mobile only)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => Platform.OS !== 'web',
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10,
      onPanResponderMove: (_, gs) => {
        swipeAnim.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) > SWIPE_THRESHOLD) {
          Animated.timing(swipeAnim, {
            toValue: gs.dx > 0 ? 400 : -400,
            duration: 220,
            useNativeDriver: true,
          }).start(() => onDismiss(notification.id));
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Offset: each card in the stack is slightly offset
  const stackOffset = (total - 1 - index) * 6;
  const scaleValue = 1 - (total - 1 - index) * 0.03;

  const firstLine = (notification.body || '').split('\n')[0];
  const preview = firstLine.length > 60 ? firstLine.substring(0, 60) + '…' : firstLine;

  const containerStyle = isLandscape
    ? [
        styles.toastLandscape,
        {
          bottom: 100 + index * 8,
          right: 20,
          transform: [
            { translateX: Animated.add(slideAnim, swipeAnim) },
            { scale: scaleValue },
          ],
          opacity: opacityAnim,
          backgroundColor: colors.white,
          borderColor: colors.p500,
          zIndex: 10000 + index,
          width: TOAST_WIDTH_LANDSCAPE,
        },
      ]
    : [
        styles.toastPortrait,
        {
          transform: [
            { translateY: Animated.add(slideAnim, swipeAnim) },
            { scale: scaleValue },
          ],
          opacity: opacityAnim,
          backgroundColor: colors.white,
          borderColor: colors.p500,
          zIndex: 10000 + index,
          marginTop: index * 8,
        },
      ];

  return (
    <Animated.View style={containerStyle} {...panResponder.panHandlers}>
      <TouchableOpacity
        style={styles.content}
        onPress={() => { onPress(notification); dismiss(); }}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: colors.p100 }]}>
          <Text style={{ color: colors.p500, fontSize: sizes.scale(18), fontWeight: '700' }}>
            {(notification.title || '?')[0].toUpperCase()}
          </Text>
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.toastTitle, { color: colors.n900, fontSize: sizes.scale(14) }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={[styles.toastBody, { color: colors.n500, fontSize: sizes.scale(13) }]} numberOfLines={1}>
            {preview}
          </Text>
        </View>

        {/* Close button */}
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="x" size={sizes.scale(16)} color={colors.n500} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function InAppNotification() {
  const { colors, sizes } = useTheme();
  const router = useRouter();
  const { notifications, dismissNotification, setPendingChannelId } = useChatNotifications();
  const { } = usePushNotifications(); // Activates native push listener

  const [dimensions, setDimensions] = React.useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub.remove();
  }, []);

  const isLandscape = Platform.OS === 'web' && dimensions.width > dimensions.height;

  const handlePress = (notification) => {
    if (notification.type === 'message' && notification.channelId) {
      setPendingChannelId(notification.channelId);
      router.push('/(chat)/list');
    } else if (notification.type === 'system' && notification.targetRoute) {
      router.push(notification.targetRoute);
    }
  };

  if (notifications.length === 0) return null;

  const container = (
    <View
      style={[
        styles.wrapper,
        isLandscape ? styles.wrapperLandscape : styles.wrapperPortrait,
      ]}
      pointerEvents="box-none"
    >
      {notifications.map((notif, index) => (
        <ToastCard
          key={notif.id}
          notification={notif}
          index={index}
          total={notifications.length}
          isLandscape={isLandscape}
          colors={colors}
          sizes={sizes}
          onDismiss={dismissNotification}
          onPress={handlePress}
        />
      ))}
    </View>
  );

  return container;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  wrapperPortrait: {
    top: 0,
    left: 0,
    right: 0,
  },
  wrapperLandscape: {
    bottom: 0,
    right: 0,
    width: TOAST_WIDTH_LANDSCAPE + 40,
  },
  toastPortrait: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  toastLandscape: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  toastTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  toastBody: {
    fontWeight: '400',
  },
  closeBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
