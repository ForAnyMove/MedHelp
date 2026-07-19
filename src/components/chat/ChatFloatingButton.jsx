import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Animated } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../ui/Icon';
import { useSession } from '../../context/SessionContext';
import { useComponentContext } from '../../context/GlobalContext';
import { useChatNotifications } from '../../context/ChatNotificationContext';

/**
 * Floating Chat Button.
 * Visible only on specific main screens:
 * Patient: Home, Doctors, Consultation, History (NOT Profile)
 * Doctor: Home, Balance, Consultation, History (NOT Profile)
 */
export function ChatFloatingButton() {
  const pathname = usePathname();
  const router = useRouter();
  const { colors, sizes } = useTheme();
  const styles = getStyles(sizes, colors);
  const { session } = useSession();
  const { chatButtonConfig } = useComponentContext();
  const { totalUnreadConversations } = useChatNotifications();

  // Define visibility rules
  const shouldBeVisible = React.useMemo(() => {
    if (!session) return false;
    if (!chatButtonConfig.visible) return false;

    const activeTab = pathname === '/' ? 'home' : (pathname.startsWith('/') ? pathname.slice(1) : pathname);
    const mainTabs = ['home', 'doctors', 'consultation', 'history', 'balance'];

    return mainTabs.includes(activeTab);
  }, [pathname, session, chatButtonConfig.visible]);

  const [isMounted, setIsMounted] = React.useState(shouldBeVisible);
  const fadeAnim = React.useRef(new Animated.Value(shouldBeVisible ? 1 : 0)).current;

  React.useEffect(() => {
    if (shouldBeVisible) {
      setIsMounted(true);
      if (chatButtonConfig.animated) {
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      } else {
        fadeAnim.setValue(1);
      }
    } else {
      if (chatButtonConfig.animated) {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setIsMounted(false);
        });
      } else {
        fadeAnim.setValue(0);
        setIsMounted(false);
      }
    }
  }, [shouldBeVisible, chatButtonConfig.animated, fadeAnim]);

  if (!isMounted) return null;

  const btnSize = sizes.scale(60);
  const btnRadius = sizes.scale(30);
  const badgeSize = sizes.scale(22);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, bottom: sizes.scale(116), right: sizes.spacing.m }]}>
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: colors.p500,
          width: btnSize,
          height: btnSize,
          borderRadius: btnRadius,
        }]}
        activeOpacity={0.8}
        onPress={() => router.push('/(chat)/list')}
      >
        <Icon name="chat" size={sizes.scale(32)} color={colors.white} />
      </TouchableOpacity>

      {/* Unread conversations badge */}
      {totalUnreadConversations > 0 && (
        <View style={[styles.badge, {
          backgroundColor: colors.danger,
          minWidth: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          top: -sizes.scale(4),
          right: -sizes.scale(4),
        }]}>
          <Text style={[styles.badgeText, { fontSize: sizes.scale(11) }]}>
            {totalUnreadConversations > 99 ? '99+' : totalUnreadConversations}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const getStyles = (sizes, colors) => ({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: sizes.scale(0), height: sizes.scale(4) },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sizes.scale(4),
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontWeight: '700',
    lineHeight: sizes.scale(16),
  },
});
