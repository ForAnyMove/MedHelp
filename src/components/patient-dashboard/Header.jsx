import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../locales/i18n';
import { useTheme } from '../../theme/ThemeContext';
import { useComponentContext } from '../../context/GlobalContext';
import { useStyles } from '../../theme/useStyles';
import { Icon } from '../ui/Icon';

export function Header({ onNotificationPress }) {
  const { sizes, colors } = useTheme();
  const { user, initials, notificationController } = useComponentContext();
  const { t } = useTranslation();
  const styles = useStyles(themeStyles);

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.greeting}>{t('dashboard.greeting', { name: user.firstName })}</Text>
      </View>
      
      <View style={{flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.m}}>
        <TouchableOpacity style={styles.notifBtn} onPress={onNotificationPress}>
          <Icon name="notifications" size={sizes.scale(24)} color={colors.p500} />
          {(notificationController?.notifications || []).filter(n => !n.is_read).length > 0 && (
            <View style={styles.notifDot} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const themeStyles = (theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.sizes.spacing.s,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: theme.sizes.scale(32),
    height: theme.sizes.scale(32),
    borderRadius: theme.sizes.scale(20),
    backgroundColor: theme.colors.p500,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.sizes.spacing.s,
  },
  avatarText: {
    ...theme.sizes.typography.h3,
    color: theme.colors.white,
  },
  greeting: {
    ...theme.sizes.typography.h4,
    color: theme.colors.n900,
  },
  notifBtn: {
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
  langBtn: {
    paddingHorizontal: theme.sizes.spacing.xs,
    paddingVertical: theme.sizes.spacing.xs,
    backgroundColor: theme.colors.n100,
    borderRadius: theme.sizes.borderRadius.small,
  },
  langText: {
    ...theme.sizes.typography.caption,
    fontWeight: '600',
    color: theme.colors.n700,
  }
});
