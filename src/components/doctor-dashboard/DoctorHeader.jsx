import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { useStyles } from '../../theme/useStyles';
import { Avatar } from '../common/Avatar';
import { Icon } from '../ui/Icon';
import { useComponentContext } from '../../context/GlobalContext';

export function DoctorHeader({ profile, onNotificationPress }) {
  const { colors, sizes } = useTheme();
  const { t } = useTranslation();
  const { notificationController } = useComponentContext();
  const styles = useStyles(themeStyles);

  if (!profile) return <View style={styles.container} />;

  const hasUnread = (notificationController?.notifications || []).some(n => !n.is_read);

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <Avatar 
          source={(profile.pendingAvatarUrl || profile.avatarUrl) ? { uri: (profile.pendingAvatarUrl || profile.avatarUrl) } : null}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size={sizes.scale(29)}
          style={styles.avatar}
        />
        <Text style={styles.greeting}>
          {t('doctor_dashboard.hi_dr', { name: profile.firstName || '' })}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.notification} 
        onPress={onNotificationPress}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <Icon name="notifications" size={sizes.scale(24)} color={colors.p500} />
        {hasUnread && <View style={styles.notifDot} />}
      </TouchableOpacity>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.sizes.spacing.m,
    marginBottom: theme.sizes.spacing.s,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: theme.sizes.scale(29),
    height: theme.sizes.scale(29),
    borderRadius: theme.sizes.borderRadius.full,
    marginRight: theme.sizes.spacing.s,
  },
  greeting: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n700,
  },
  notification: {
    position: 'relative',
    padding: theme.sizes.spacing.xs,
  },
  notifDot: {
    position: 'absolute',
    top: theme.sizes.scale(6),
    right: theme.sizes.scale(6),
    width: theme.sizes.scale(8),
    height: theme.sizes.scale(8),
    borderRadius: theme.sizes.scale(4),
    backgroundColor: theme.colors.danger || '#F05252',
    borderWidth: 1.5,
    borderColor: theme.colors.bg || theme.colors.white,
  },
});
