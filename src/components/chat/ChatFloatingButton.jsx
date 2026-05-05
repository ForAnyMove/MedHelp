import React from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Text } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { Icon } from '../ui/Icon';
import { useSession } from '../../context/SessionContext';
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
  const { session } = useSession();
  const { totalUnreadConversations } = useChatNotifications();

  // Define visibility rules
  const isVisible = React.useMemo(() => {
    // Hidden if not logged in
    if (!session) return false;

    const activeTab = pathname === '/' ? 'home' : (pathname.startsWith('/') ? pathname.slice(1) : pathname);

    const mainTabs = [
      'home',
      'doctors',
      'consultation',
      'history',
      'balance'
    ];

    return mainTabs.includes(activeTab);
  }, [pathname, session]);

  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible]);

  if (!isVisible) return null;

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
        <Icon name="message-square" size={sizes.scale(24)} color={colors.white} />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    lineHeight: 16,
  },
});
