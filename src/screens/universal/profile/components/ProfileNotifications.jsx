import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useStyles } from '../../../../theme/useStyles';
import { formatRelativeTime } from '../../../../utils/dateUtils';
import { useComponentContext } from '../../../../context/GlobalContext';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { useTheme } from '../../../../theme/ThemeContext';



export function ProfileNotifications({ user, onClose }) {
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);
  const { notificationController } = useComponentContext();
  const router = useRouter();
  const { colors, sizes } = useTheme();

  const [selectedNotification, setSelectedNotification] = useState(null);
  const { notifications, markAsRead, markAllAsRead } = notificationController;

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  const handleNotificationPress = (item) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }

    // 1. Owner join requests
    if (item.type === 'owner_join_request') {
      if (onClose) onClose();
      router.push('/doctors?view=requests');
      return;
    }

    // 2. Lab results / Additional lab tests
    if (item.type === 'additional_lab_requested' || item.type === 'test_results_ready') {
      const labId = item.data?.lab_result_id || item.reference_id;
      if (onClose) onClose();
      if (labId) {
        router.push(`/(patient)/lab-results/${labId}`);
      } else {
        router.push('/(patient)/lab-results');
      }
      return;
    }

    // 3. Consultation lifecycle routing
    const isConsultation = 
      item.type === 'consultation_started' ||
      item.type === 'consultation_resumed' ||
      item.type === 'consultation_completed' ||
      item.type === 'canceled_appointment' ||
      item.type === 'rescheduled_appointment' ||
      item.type === 'new_appointment' ||
      item.data?.url?.includes('consultation');

    if (isConsultation) {
      const url = item.data?.url || '';
      const idMatch = url.match(/consultation\/([^&/?]+)/) || url.match(/id=([^&]+)/);
      const consultationId = item.reference_id || item.data?.consultation_id || (idMatch ? idMatch[1] : null);

      if (consultationId) {
        if (onClose) onClose();

        // Doctor perspective
        if (user?.role === 'doctor') {
          if (item.type === 'consultation_started' || item.type === 'consultation_resumed') {
            router.push(`/consultation/${consultationId}`);
          } else if (item.type === 'new_appointment') {
            router.push(`/(doctor)?tab=consultation&openConsultationId=${consultationId}&action=view`);
          } else {
            // Completed, canceled, rescheduled -> consultation history detail
            router.push(`/(doctor)?tab=history&openHistoryId=${consultationId}`);
          }
          return;
        }

        // Patient perspective
        if (user?.role === 'patient') {
          if (item.type === 'consultation_started' || item.type === 'consultation_resumed') {
            // Active live call room
            router.push(`/consultation/${consultationId}`);
          } else if (item.type === 'rescheduled_appointment') {
            // Upcoming appointments tab
            router.push('/(patient)?tab=consultations');
          } else {
            // Completed, canceled -> patient history detail (diagnosis, prescription, summary)
            router.push(`/(patient)?tab=history&openHistoryId=${consultationId}`);
          }
          return;
        }
      }
    }

    // 4. Custom URL deep link
    if (item.data?.url) {
      const url = item.data.url;
      if (url.startsWith('/')) {
        if (onClose) onClose();
        router.push(url);
        return;
      }

      try {
        const parsed = Linking.parse(url);
        if (onClose) onClose();
        if (parsed.hostname === 'lab-result' && parsed.path) {
          router.push(`/(patient)/lab-results/${parsed.path}`);
          return;
        }
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

    // 5. Fallback for reference_id
    if (item.reference_id) {
      if (onClose) onClose();
      if (user?.role === 'doctor') {
        router.push(`/(doctor)?tab=history&openHistoryId=${item.reference_id}`);
      } else {
        router.push(`/(patient)?tab=history&openHistoryId=${item.reference_id}`);
      }
      return;
    }

    // 6. Informational notifications (system, moderation, reports, join status) -> open in detail modal
    setSelectedNotification(item);
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

      <Modal
        visible={!!selectedNotification}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedNotification && t(`notifications.${selectedNotification.type}`, { defaultValue: selectedNotification.title || selectedNotification.type, ...(selectedNotification.data || {}) })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                <Icon name="close" size={sizes.scale(22)} color={colors.n500} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>
              {selectedNotification && t(`notifications.${selectedNotification.type}_desc`, { 
                defaultValue: selectedNotification.description, 
                ...(selectedNotification.data || {}),
                admin_comment_text: selectedNotification.data?.admin_comment ? `\n\n${t('profile.admin_note', 'Admin Note')}: ${selectedNotification.data.admin_comment}` : ''
              })}
            </Text>
            <Button
              title={t('common.close', 'Close')}
              variant="primary"
              onPress={() => setSelectedNotification(null)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
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

      case 'canceled_appointment':
        return { name: 'calendar-x', bgColor: colors.danger + '22', color: colors.danger };

      case 'rescheduled_appointment':
        return { name: 'time', bgColor: colors.warning + '22', color: colors.warning };

      case 'consultation_started':
      case 'consultation_resumed':
        return { name: 'video', bgColor: colors.success + '22', color: colors.success };

      case 'consultation_completed':
        return { name: 'medic-history', bgColor: colors.p100, color: colors.p500 };

      case 'test_results_ready':
      case 'additional_lab_requested':
        return { name: 'chemical', bgColor: colors.info + '22', color: colors.sBlue };

      case 'new_message':
        return { name: 'chat', bgColor: colors.p100, color: colors.p500 };

      case 'doctor_join_rejected':
      case 'join_request_cancelled':
        return { name: 'close', bgColor: colors.danger + '22', color: colors.danger };

      case 'org_removed':
        return { name: 'LogOut', bgColor: colors.warning + '22', color: colors.warning };

      case 'doctor_join_accepted':
      case 'moderation_approved':
      case 'report_resolved':
        return { name: 'check', bgColor: colors.success + '22', color: colors.success };

      case 'moderation_rejected':
      case 'report_dismissed':
        return { name: 'warning', bgColor: colors.danger + '22', color: colors.danger };

      case 'owner_join_request':
        return { name: 'patients', bgColor: colors.info + '22', color: colors.sBlue };

      case 'system':
      default:
        return { name: 'notifications', bgColor: colors.p100, color: colors.p500 };
    }
  };

  const config = getIconConfig(item.type);

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
        <Icon name={config.name} size={sizes.scale(22)} color={config.color} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {t(`notifications.${item.type}`, { defaultValue: item.title || item.type, ...(item.data || {}) })}
        </Text>
        <Text style={styles.itemDesc} numberOfLines={2}>
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
    shadowColor: theme.colors.n900,
    shadowOffset: { width: theme.sizes.scale(0), height: theme.sizes.scale(2) },
    shadowOpacity: 0.04,
    shadowRadius: theme.sizes.scale(8),
    elevation: 2,
  },
  iconContainer: {
    width: theme.sizes.scale(46),
    height: theme.sizes.scale(46),
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
    marginBottom: theme.sizes.scale(3),
    lineHeight: theme.sizes.scale(18),
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.sizes.spacing.l,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    width: '100%',
    maxWidth: theme.sizes.scale(400),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.sizes.spacing.m,
  },
  modalTitle: {
    ...theme.sizes.typography.h3,
    color: theme.colors.n900,
    flex: 1,
    marginRight: theme.sizes.spacing.s,
  },
  modalDesc: {
    ...theme.sizes.typography.bodyMedium,
    color: theme.colors.n700,
    marginBottom: theme.sizes.spacing.xl,
    lineHeight: theme.sizes.scale(22),
  },
  modalButton: {
    width: '100%',
  }
});
