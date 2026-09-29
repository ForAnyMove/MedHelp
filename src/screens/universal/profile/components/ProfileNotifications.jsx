import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { formatRelativeTime } from '../../../../utils/dateUtils';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Icon } from '../../../../components/ui/Icon';
import { useTheme } from '../../../../theme/ThemeContext';



export function ProfileNotifications({ user, onClose }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { notificationController } = useComponentContext();
  const router = useRouter();

  const { notifications, markAsRead, markAllAsRead } = notificationController;

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const handleNotificationPress = (item) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }

    if (item.type === 'owner_join_request') {
      if (onClose) onClose();
      router.push('/doctors?view=requests');
      return;
    }

    if (item.data?.url) {
      const url = item.data.url;
      const isConsultation = url.includes('completed-consultation') || url.includes('consultation/');
      
      if (isConsultation && user?.role === 'doctor') {
        const idMatch = url.match(/id=([^&]+)/) || url.match(/consultation\/([^&/?]+)/);
        const id = idMatch ? idMatch[1] : item.reference_id;
        if (id) {
          if (onClose) onClose();
          router.push(`/(doctor)?tab=history&openHistoryId=${id}`);
          return;
        }
      }

      if (url.includes('completed-consultation') && user?.role === 'patient') {
        const idMatch = url.match(/id=([^&]+)/);
        const id = idMatch ? idMatch[1] : item.reference_id;
        if (id) {
          if (onClose) onClose();
          router.push(`/(patient)?tab=history&openHistoryId=${id}`);
          return;
        }
      }

      if (url.startsWith('/')) {
        if (onClose) onClose();
        router.push(url);
        return;
      }

      try {
        const parsed = Linking.parse(url);
        if (onClose) onClose();
        if (parsed.hostname) {
          const routePath = parsed.path ? `/${parsed.path}` : '';
          router.push(`/${parsed.hostname}${routePath}`);
        } else {
          router.push(url);
        }
      } catch (e) {
        if (onClose) onClose();
        router.push(url);
      }
      return;
    }

    if (item.reference_id) {
      if (onClose) onClose();
      if (user?.role === 'doctor') {
        router.push(`/(doctor)?tab=history&openHistoryId=${item.reference_id}`);
      } else {
        router.push(`/consultation/${item.reference_id}`);
      }
    }
    // Handle other types here
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('profile.notifications')} {unreadCount > 0 && <Text style={styles.unreadCount}>({unreadCount})</Text>}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllText}>{t('profile.mark_all_read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>{t('profile.no_notifications', 'No notifications yet')}</Text>
        ) : (
          notifications.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onPress={() => handleNotificationPress(item)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const NotificationItem = ({ item, onPress }) => {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { colors, sizes } = useTheme();

  const getIconConfig = (type) => {
    switch (type) {
      case 'confirmed_appointment':
      case 'new_appointment':
        return { name: 'calendar', bgColor: colors.p100, color: colors.p500 };
      case 'test_results_ready':
        return { name: 'flask-conical', bgColor: colors.warning + '33', color: colors.warning };
      case 'new_message':
        return { name: 'stethoscope', bgColor: colors.danger + '33', color: colors.danger };
      case 'doctor_join_rejected':
        return { name: 'close', bgColor: colors.danger + '22', color: colors.danger };
      case 'org_removed':
        return { name: 'logout', bgColor: colors.warning + '22', color: colors.warning };
      case 'doctor_join_accepted':
        return { name: 'check', bgColor: colors.success + '22', color: colors.success };
      case 'owner_join_request':
        return { name: 'group', bgColor: colors.info + '22', color: colors.info };
      default:
        return { name: 'bell', bgColor: colors.info + '33', color: colors.sBlue };
    }
  };

  const config = getIconConfig(item.type);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Icon name={config.name} size={sizes.scale(24)} color={config.color} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.itemTitle}>
          {t(`notifications.${item.type}`, { defaultValue: item.title || item.type, ...(item.data || {}) })}
        </Text>
        <Text style={styles.itemDesc} numberOfLines={1}>
          {t(`notifications.${item.type}_desc`, { defaultValue: item.description, ...(item.data || {}) })}
        </Text>
        <Text style={styles.timeText}>{formatRelativeTime(item.created_at, t)}</Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

const themeStyles = (theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.spacing.m,
    paddingTop: theme.sizes.spacing.s,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.m,
  },
  title: {
    ...theme.sizes.typography.h2,
    color: theme.colors.n700,
  },
  unreadCount: {
    color: theme.colors.p500,
  },
  markAllText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.p500,
  },
  emptyText: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n500,
    textAlign: 'center',
    marginTop: theme.sizes.spacing.xl,
  },
  scrollContent: {
    paddingBottom: theme.sizes.spacing.l,
    gap: theme.sizes.spacing.s,
  },
  // Item styles
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.m,
    shadowColor: /* TODO: color */ '#000',
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: theme.sizes.scale(48),
    height: theme.sizes.scale(48),
    borderRadius: theme.sizes.borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.m,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
    marginBottom: theme.sizes.scale(2),
  },
  itemDesc: {
    ...theme.sizes.typography.bodySmall,
    color: theme.colors.n500,
    marginBottom: theme.sizes.scale(2),
  },
  timeText: {
    ...theme.sizes.typography.caption,
    color: theme.colors.p400,
  },
  unreadDot: {
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: theme.colors.p500,
    marginLeft: theme.sizes.spacing.s,
  }
});
